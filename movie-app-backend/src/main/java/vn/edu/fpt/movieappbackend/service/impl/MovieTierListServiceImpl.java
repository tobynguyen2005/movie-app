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
        return tierEntryRepository.findAllByTierOrderBySortOrderAscIdAsc(MovieTier.S)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TierListMovieOptionResponse> getAvailableMovies(String keyword) {
        String normalizedKeyword = keyword == null ? "" : keyword.trim();
        List<Movie> completedMovies = normalizedKeyword.isEmpty()
                ? movieRepository.findByStatusOrderByTitleAsc(MovieStatus.COMPLETED)
                : movieRepository.findByStatusAndTitleContainingIgnoreCaseOrderByTitleAsc(
                        MovieStatus.COMPLETED, normalizedKeyword);

        Set<Long> assignedMovieIds = tierEntryRepository.findAllByTierOrderBySortOrderAscIdAsc(MovieTier.S).stream()
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
        MovieTierEntry existingEntry = tierEntryRepository.findByMovie_Id(movie.getId()).orElse(null);
        if (existingEntry != null && existingEntry.getTier() == MovieTier.S) {
            throw new ConflictException("Phim \"" + movie.getTitle() + "\" đã có trong Masterpiece.");
        }

        int nextPosition = tierEntryRepository.findAllByTierOrderBySortOrderAscIdAsc(MovieTier.S).stream()
                .mapToInt(MovieTierEntry::getSortOrder).max().orElse(-1) + 1;

        MovieTierEntry entry = existingEntry != null ? existingEntry : MovieTierEntry.builder().movie(movie).build();
        entry.setTier(MovieTier.S);
        entry.setSortOrder(nextPosition);
        return toResponse(tierEntryRepository.save(entry));
    }

    @Override
    @Transactional
    public List<MovieTierEntryResponse> reorderEntries(List<ReorderMovieTierEntryRequest> requests) {
        List<MovieTierEntry> existingEntries = tierEntryRepository.findAllByTierOrderBySortOrderAscIdAsc(MovieTier.S);
        if (requests == null || requests.size() != existingEntries.size()) {
            throw new ConflictException("Danh sách sắp xếp không khớp với Tier List hiện tại. Hãy tải lại trang và thử lại.");
        }

        Map<Long, MovieTierEntry> entriesById = new HashMap<>();
        existingEntries.forEach(entry -> entriesById.put(entry.getId(), entry));
        Set<Long> receivedIds = new HashSet<>();
        Set<Integer> usedPositions = new HashSet<>();

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
            if (request.tier() != MovieTier.S) {
                throw new ConflictException("Masterpiece chỉ hỗ trợ một danh sách đề xuất, không có tier khác.");
            }
            if (!usedPositions.add(request.position())) {
                throw new ConflictException("Vị trí phim trong Masterpiece bị trùng.");
            }
            entry.setTier(MovieTier.S);
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
        tierEntryRepository.deleteAllByTier(MovieTier.S);
    }

    private void normalizePositions() {
        List<MovieTierEntry> entries = tierEntryRepository.findAllByTierOrderBySortOrderAscIdAsc(MovieTier.S);
        for (int index = 0; index < entries.size(); index++) {
            entries.get(index).setSortOrder(index);
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
