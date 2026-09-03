package vn.edu.fpt.movieappbackend.service;

import vn.edu.fpt.movieappbackend.dto.request.GenreRequest;
import vn.edu.fpt.movieappbackend.dto.response.GenreResponse;

import java.util.List;

public interface IGenreService {
    List<GenreResponse> getAllGenres();
    GenreResponse createGenre(GenreRequest request);
    GenreResponse updateGenre(Long id, GenreRequest request);
    void deleteGenre(Long id);
}
