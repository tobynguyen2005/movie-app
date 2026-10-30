package vn.edu.fpt.movieappbackend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.fpt.movieappbackend.dto.request.GenreRequest;
import vn.edu.fpt.movieappbackend.dto.response.GenreResponse;
import vn.edu.fpt.movieappbackend.entity.Genre;
import vn.edu.fpt.movieappbackend.exception.ResourceNotFoundException;
import vn.edu.fpt.movieappbackend.exception.ConflictException;
import vn.edu.fpt.movieappbackend.repository.GenreRepository;
import vn.edu.fpt.movieappbackend.repository.MovieRepository;
import vn.edu.fpt.movieappbackend.service.IGenreService;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GenreServiceImpl implements IGenreService {

    private final GenreRepository genreRepository;
    private final MovieRepository movieRepository;

    @Override
    public List<GenreResponse> getAllGenres() {
        return genreRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public GenreResponse createGenre(GenreRequest request) {
        String name = request.name().trim();
        if (genreRepository.existsByNameIgnoreCase(name)) {
            throw new ConflictException("Thể loại \"" + name + "\" đã tồn tại. Vui lòng chọn tên khác.");
        }

        Genre genre = Genre.builder().name(name).build();
        return mapToResponse(genreRepository.save(genre));
    }

    @Override
    @Transactional
    public GenreResponse updateGenre(Long id, GenreRequest request) {
        Genre genre = genreRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thể loại với ID: " + id));
        String name = request.name().trim();
        if (genreRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new ConflictException("Thể loại \"" + name + "\" đã được sử dụng bởi một bản ghi khác.");
        }

        genre.setName(name);
        return mapToResponse(genreRepository.save(genre));
    }

    @Override
    @Transactional
    public void deleteGenre(Long id) {
        Genre genre = genreRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thể loại với ID: " + id));

        if (movieRepository.existsByGenres_Id(id)) {
            throw new ConflictException("Không thể xóa thể loại \"" + genre.getName()
                    + "\" vì đang được gán cho một hoặc nhiều phim. Hãy gỡ thể loại khỏi các phim trước.");
        }

        genreRepository.delete(genre);
    }

    public GenreResponse mapToResponse(Genre genre) {
        return new GenreResponse(genre.getId(), genre.getName());
    }
}