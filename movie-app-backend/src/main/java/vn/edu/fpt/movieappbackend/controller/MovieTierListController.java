package vn.edu.fpt.movieappbackend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.fpt.movieappbackend.dto.request.CreateMovieTierEntryRequest;
import vn.edu.fpt.movieappbackend.dto.request.ReorderMovieTierEntryRequest;
import vn.edu.fpt.movieappbackend.dto.response.MovieTierEntryResponse;
import vn.edu.fpt.movieappbackend.dto.response.TierListMovieOptionResponse;
import vn.edu.fpt.movieappbackend.service.IMovieTierListService;

import java.util.List;

@RestController
@RequestMapping("/api/tier-list")
@RequiredArgsConstructor
public class MovieTierListController {

    private final IMovieTierListService tierListService;

    @GetMapping
    public ResponseEntity<List<MovieTierEntryResponse>> getEntries() {
        return ResponseEntity.ok(tierListService.getEntries());
    }

    @GetMapping("/available-movies")
    public ResponseEntity<List<TierListMovieOptionResponse>> getAvailableMovies(
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(tierListService.getAvailableMovies(keyword));
    }

    @PostMapping
    public ResponseEntity<MovieTierEntryResponse> addEntry(
            @Valid @RequestBody CreateMovieTierEntryRequest request) {
        return new ResponseEntity<>(tierListService.addEntry(request), HttpStatus.CREATED);
    }

    @PutMapping("/reorder")
    public ResponseEntity<List<MovieTierEntryResponse>> reorderEntries(
            @Valid @RequestBody List<@Valid ReorderMovieTierEntryRequest> requests) {
        return ResponseEntity.ok(tierListService.reorderEntries(requests));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeEntry(@PathVariable Long id) {
        tierListService.removeEntry(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> clearEntries() {
        tierListService.clearEntries();
        return ResponseEntity.noContent().build();
    }
}
