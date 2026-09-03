package vn.edu.fpt.movieappbackend.service;

import vn.edu.fpt.movieappbackend.dto.request.MovieRequest;
import vn.edu.fpt.movieappbackend.dto.response.MovieResponse;
import vn.edu.fpt.movieappbackend.dto.response.PageResponse;
import vn.edu.fpt.movieappbackend.entity.enums.MovieStatus;

public interface IMovieService {
    PageResponse<MovieResponse> getMovies(String title, Integer releaseYear, String country, Long genreId, Long maleActorId, Long femaleActorId, MovieStatus status, int page, int size);
    MovieResponse getMovieById(Long id);
    MovieResponse createMovie(MovieRequest request);
    MovieResponse updateMovie(Long id, MovieRequest request);
    void deleteMovie(Long id);
}