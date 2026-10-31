package vn.edu.fpt.movieappbackend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.fpt.movieappbackend.dto.request.CreateMovieTierEntryRequest;
import vn.edu.fpt.movieappbackend.dto.request.ReorderMovieTierEntryRequest;
import vn.edu.fpt.movieappbackend.dto.response.MovieTierEntryResponse;
import vn.edu.fpt.movieappbackend.dto.response.TierListMovieOptionResponse;
import vn.edu.fpt.movieappbackend.entity.Movie;
import vn.edu.fpt.movieappbackend.entity.MovieTierEntry;
import vn.edu.fpt.movieappbackend.entity.enums.MovieStatus;
import vn.edu.fpt.movieappbackend.entity.enums.MovieTier;
import vn.edu.fpt.movieappbackend.exception.ConflictException;
import vn.edu.fpt.movieappbackend.exception.ResourceNotFoundException;
import vn.edu.fpt.movieappbackend.repository.MovieRepository;
import vn.edu.fpt.movieappbackend.repository.MovieTierEntryRepository;
import vn.edu.fpt.movieappbackend.service.IMovieTierListService;

import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MovieTierListServiceImpl implements IMovieTierListService {

    private final MovieRepository movieRepository;
    private final MovieTierEntryRepository tierEntryRepository;

    @Override
    @Transactional(readOnly = true)
    public List<MovieTierEntryResponse> getEntries() {
        return tierEntryRepository.findAll().stream()
                .sorted(Comparator
                        .comparingInt((MovieTierEntry entry) -> entry.getTier().ordinal())
                        .thenComparing(MovieTierEntry::getSortOrder)
                        .thenComparing(MovieTierEntry::getId))
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TierListMovieOptionResponse> getAvailableMovies(String keyword) {
        String normalizedKeyword = keyword == null ? "" : keyword.trim();
        List<Movie> completedMovies = normalizedKeyword.isEmpty()
                ? movieRepository.findByStatusOrderByTitleAsc(MovieStatus.COMPLETED)
                : movieRepository.findByStatusAndTitleContainingIgnoreCaseOrderByTitleAsc(
                        MovieStatus.COMPLETED, normalizedKeyword);

        Set<Long> assignedMovieIds = tierEntryRepository.findAll().stream()
                .map(entry -> entry.getMovie().getId())
                .collect(Collectors.toSet());

        return completedMovies.stream()
                .filter(movie -> !assignedMovieIds.contains(movie.getId()))
                .map(movie -> new TierListMovieOptionResponse(
                        movie.getId(), movie.getTitle(), movie.getReleaseYear(),
                        movie.getPosterUrl(), movie.getCountry()))
                .toList();
    }

    @Override
    @Transactional
    public MovieTierEntryResponse addEntry(CreateMovieTierEntryRequest request) {
        Movie movie = movieRepository.findById(request.movieId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy phim với ID: " + request.movieId()));

        if (movie.getStatus() != MovieStatus.COMPLETED) {
            throw new ConflictException(
                    "Chỉ có thể thêm phim đã hoàn thành (Đã xem) vào Tier List. Phim \""
                            + movie.getTitle() + "\" hiện có trạng thái " + movie.getStatus() + ".");
        }
        if (tierEntryRepository.existsByMovie_Id(movie.getId())) {
            throw new ConflictException("Phim \"" + movie.getTitle() + "\" đã có trong Tier List.");
        }

        int nextPosition = tierEntryRepository.findAll().stream()
                .filter(entry -> entry.getTier() == request.tier())
                .mapToInt(MovieTierEntry::getSortOrder)
                .max().orElse(-1) + 1;

        MovieTierEntry entry = MovieTierEntry.builder()
                .movie(movie)
                .tier(request.tier())
                .sortOrder(nextPosition)
                .build();

        return toResponse(tierEntryRepository.save(entry));
    }

    @Override
    @Transactional
    public List<MovieTierEntryResponse> reorderEntries(List<ReorderMovieTierEntryRequest> requests) {
        List<MovieTierEntry> existingEntries = tierEntryRepository.findAll();
        if (requests == null || requests.size() != existingEntries.size()) {
            throw new ConflictException("Danh sách sắp xếp không khớp với Tier List hiện tại. Hãy tải lại trang và thử lại.");
        }

        Map<Long, MovieTierEntry> entriesById = new HashMap<>();
        existingEntries.forEach(entry -> entriesById.put(entry.getId(), entry));
        Set<Long> receivedIds = new HashSet<>();
        Map<MovieTier, Set<Integer>> usedPositions = new HashMap<>();

        for (ReorderMovieTierEntryRequest request : requests) {
            if (!receivedIds.add(request.id())) {
                throw new ConflictException("Dữ liệu sắp xếp chứa ID bị lặp: " + request.id());
            }
            MovieTierEntry entry = entriesById.get(request.id());
            if (entry == null) {
                throw new ResourceNotFoundException("Không tìm thấy mục Tier List với ID: " + request.id());
            }
            if (request.position() < 0) {
                throw new ConflictException("Vị trí sắp xếp không được âm.");
            }
            Set<Integer> positions = usedPositions.computeIfAbsent(request.tier(), ignored -> new HashSet<>());
            if (!positions.add(request.position())) {
                throw new ConflictException("Vị trí trong tier " + request.tier() + " bị trùng.");
            }
            entry.setTier(request.tier());
            entry.setSortOrder(request.position());
        }

        if (!receivedIds.equals(entriesById.keySet())) {
            throw new ConflictException("Một số phim bị thiếu khỏi yêu cầu sắp xếp. Hãy tải lại Tier List.");
        }

        tierEntryRepository.saveAll(existingEntries);
        return getEntries();
    }

    @Override
    @Transactional
    public void removeEntry(Long id) {
        MovieTierEntry entry = tierEntryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy mục Tier List với ID: " + id));
        tierEntryRepository.delete(entry);
        normalizePositions();
    }

    @Override
    @Transactional
    public void clearEntries() {
        tierEntryRepository.deleteAllInBatch();
    }

    private void normalizePositions() {
        List<MovieTierEntry> entries = tierEntryRepository.findAll().stream()
                .sorted(Comparator
                        .comparingInt((MovieTierEntry entry) -> entry.getTier().ordinal())
                        .thenComparing(MovieTierEntry::getSortOrder)
                        .thenComparing(MovieTierEntry::getId))
                .toList();
        Map<MovieTier, Integer> nextPositions = new HashMap<>();
        for (MovieTierEntry entry : entries) {
            int position = nextPositions.getOrDefault(entry.getTier(), 0);
            entry.setSortOrder(position);
            nextPositions.put(entry.getTier(), position + 1);
        }
        tierEntryRepository.saveAll(entries);
    }

    private MovieTierEntryResponse toResponse(MovieTierEntry entry) {
        Movie movie = entry.getMovie();
        return new MovieTierEntryResponse(
                entry.getId(), movie.getId(), movie.getTitle(), movie.getReleaseYear(),
                movie.getPosterUrl(), movie.getCountry(), entry.getTier(), entry.getSortOrder());
    }
}
