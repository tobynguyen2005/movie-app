package vn.edu.fpt.movieappbackend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.fpt.movieappbackend.dto.request.GenreRequest;
import vn.edu.fpt.movieappbackend.dto.response.GenreResponse;
import vn.edu.fpt.movieappbackend.entity.Genre;
import vn.edu.fpt.movieappbackend.exception.ResourceNotFoundException;
import vn.edu.fpt.movieappbackend.repository.GenreRepository;
import vn.edu.fpt.movieappbackend.service.IGenreService;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GenreServiceImpl implements IGenreService {

    private final GenreRepository genreRepository;

    @Override
    public List<GenreResponse> getAllGenres() {
        return genreRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public GenreResponse createGenre(GenreRequest request) {
        Genre genre = Genre.builder().name(request.name()).build();
        return mapToResponse(genreRepository.save(genre));
    }

    @Override
    @Transactional
    public GenreResponse updateGenre(Long id, GenreRequest request) {
        Genre genre = genreRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thể loại với ID: " + id));
        genre.setName(request.name());
        return mapToResponse(genreRepository.save(genre));
    }

    @Override
    @Transactional
    public void deleteGenre(Long id) {
        if (!genreRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy thể loại với ID: " + id);
        }
        genreRepository.deleteById(id);
    }

    public GenreResponse mapToResponse(Genre genre) {
        return new GenreResponse(genre.getId(), genre.getName());
    }
}