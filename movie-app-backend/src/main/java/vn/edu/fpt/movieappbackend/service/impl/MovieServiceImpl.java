package vn.edu.fpt.movieappbackend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.fpt.movieappbackend.dto.request.MovieRequest;
import vn.edu.fpt.movieappbackend.dto.response.ActorResponse;
import vn.edu.fpt.movieappbackend.dto.response.GenreResponse;
import vn.edu.fpt.movieappbackend.dto.response.MovieResponse;
import vn.edu.fpt.movieappbackend.entity.Actor;
import vn.edu.fpt.movieappbackend.entity.Genre;
import vn.edu.fpt.movieappbackend.entity.Movie;
import vn.edu.fpt.movieappbackend.entity.enums.MovieStatus;
import vn.edu.fpt.movieappbackend.exception.ResourceNotFoundException;
import vn.edu.fpt.movieappbackend.repository.ActorRepository;
import vn.edu.fpt.movieappbackend.repository.GenreRepository;
import vn.edu.fpt.movieappbackend.repository.MovieRepository;
import vn.edu.fpt.movieappbackend.service.IMovieService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import vn.edu.fpt.movieappbackend.dto.response.PageResponse;
import vn.edu.fpt.movieappbackend.specification.MovieSpecification;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MovieServiceImpl implements IMovieService {

    private final MovieRepository movieRepository;
    private final ActorRepository actorRepository;
    private final GenreRepository genreRepository;
    private final ActorServiceImpl actorService;
    private final GenreServiceImpl genreService;

    @Override
    @Transactional(readOnly = true)
    public PageResponse<MovieResponse> getMovies(
            String title,
            Integer releaseYear,
            String country,
            Long genreId,
            Long maleActorId,
            Long femaleActorId,
            MovieStatus status,
            int page,
            int size) {

        Pageable pageable = PageRequest.of(page, size);

        Specification<Movie> spec = MovieSpecification.filterMovies(title, releaseYear, country, genreId, maleActorId, femaleActorId, status);

        Page<Movie> moviePage = movieRepository.findAll(spec, pageable);

        List<MovieResponse> content = moviePage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return new PageResponse<>(content, moviePage.getNumber(), moviePage.getSize(),
                moviePage.getTotalElements(), moviePage.getTotalPages(), moviePage.isLast());
    }

    @Override
    @Transactional(readOnly = true)
    public MovieResponse getMovieById(Long id) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Movie với ID: " + id));
        return mapToResponse(movie);
    }

    @Override
    @Transactional
    public MovieResponse createMovie(MovieRequest request) {
        Movie movie = Movie.builder()
                .title(request.title())
                .releaseYear(request.releaseYear())
                .totalEpisodes(request.totalEpisodes())
                .country(request.country())
                .posterUrl(request.posterUrl())
                .description(request.description())
                .status(request.status() != null ? request.status() : MovieStatus.PLAN_TO_WATCH)
                .build();

        setActorsForMovie(movie, request.actorIds());
        setGenresForMovie(movie, request.genreIds());

        Movie savedMovie = movieRepository.save(movie);
        return mapToResponse(savedMovie);
    }

    @Override
    @Transactional
    public MovieResponse updateMovie(Long id, MovieRequest request) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Movie với ID: " + id));

        movie.setTitle(request.title());
        movie.setReleaseYear(request.releaseYear());
        movie.setTotalEpisodes(request.totalEpisodes());
        movie.setCountry(request.country());
        movie.setPosterUrl(request.posterUrl());
        movie.setDescription(request.description());
        if (request.status() != null) {
            movie.setStatus(request.status());
        }

        setActorsForMovie(movie, request.actorIds());
        setGenresForMovie(movie, request.genreIds());

        Movie updatedMovie = movieRepository.save(movie);
        return mapToResponse(updatedMovie);
    }

    @Override
    @Transactional
    public void deleteMovie(Long id) {
        if (!movieRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy Movie với ID: " + id);
        }
        movieRepository.deleteById(id);
    }

    private void setGenresForMovie(Movie movie, Set<Long> genreIds) {
        if (genreIds != null && !genreIds.isEmpty()) {
            List<Genre> genres = genreRepository.findAllById(genreIds);
            movie.setGenres(new HashSet<>(genres));
        } else {
            movie.setGenres(new HashSet<>());
        }
    }

    private void setActorsForMovie(Movie movie, Set<Long> actorIds) {
        if (actorIds != null && !actorIds.isEmpty()) {
            List<Actor> actors = actorRepository.findAllById(actorIds);
            movie.setActors(new HashSet<>(actors));
        } else {
            movie.setActors(new HashSet<>());
        }
    }

    private MovieResponse mapToResponse(Movie movie) {
        Set<ActorResponse> actorResponses = new HashSet<>();
        if (movie.getActors() != null) {
            actorResponses = movie.getActors().stream()
                    .map(actorService::mapToResponse)
                    .collect(Collectors.toSet());
        }

        Set<GenreResponse> genreResponses = new HashSet<>();
        if (movie.getGenres() != null) {
            genreResponses = movie.getGenres().stream()
                    .map(genreService::mapToResponse)
                    .collect(Collectors.toSet());
        }

        return new MovieResponse(
                movie.getId(),
                movie.getTitle(),
                movie.getReleaseYear(),
                movie.getTotalEpisodes(),
                movie.getCountry(),
                movie.getPosterUrl(),
                movie.getDescription(),
                movie.getStatus(),
                actorResponses,
                genreResponses
        );
    }
}