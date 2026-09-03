package vn.edu.fpt.movieappbackend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.fpt.movieappbackend.dto.request.MovieRequest;
import vn.edu.fpt.movieappbackend.dto.response.MovieResponse;
import vn.edu.fpt.movieappbackend.dto.response.PageResponse;
import vn.edu.fpt.movieappbackend.entity.enums.MovieStatus;
import vn.edu.fpt.movieappbackend.service.IMovieService;

import java.util.List;

@RestController
@RequestMapping("/api/movies")
@RequiredArgsConstructor
public class MovieController {

    private final IMovieService movieService;

    @GetMapping
    public ResponseEntity<PageResponse<MovieResponse>> getMovies(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) Integer releaseYear,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) Long genreId,
            @RequestParam(required = false) Long maleActorId,
            @RequestParam(required = false) Long femaleActorId,
            @RequestParam(required = false) MovieStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        return ResponseEntity.ok(movieService.getMovies(title, releaseYear, country, genreId, maleActorId, femaleActorId, status, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MovieResponse> getMovieById(@PathVariable Long id) {
        return ResponseEntity.ok(movieService.getMovieById(id));
    }

    @PostMapping
    public ResponseEntity<MovieResponse> createMovie(@Valid @RequestBody MovieRequest request) {
        return new ResponseEntity<>(movieService.createMovie(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MovieResponse> updateMovie(@PathVariable Long id, @Valid @RequestBody MovieRequest request) {
        return ResponseEntity.ok(movieService.updateMovie(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMovie(@PathVariable Long id) {
        movieService.deleteMovie(id);
        return ResponseEntity.noContent().build();
    }
}