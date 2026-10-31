package vn.edu.fpt.movieappbackend.service;

import vn.edu.fpt.movieappbackend.dto.request.CreateMovieTierEntryRequest;
import vn.edu.fpt.movieappbackend.dto.request.ReorderMovieTierEntryRequest;
import vn.edu.fpt.movieappbackend.dto.response.MovieTierEntryResponse;
import vn.edu.fpt.movieappbackend.dto.response.TierListMovieOptionResponse;

import java.util.List;

public interface IMovieTierListService {
    List<MovieTierEntryResponse> getEntries();
    List<TierListMovieOptionResponse> getAvailableMovies(String keyword);
    MovieTierEntryResponse addEntry(CreateMovieTierEntryRequest request);
    List<MovieTierEntryResponse> reorderEntries(List<ReorderMovieTierEntryRequest> requests);
    void removeEntry(Long id);
    void clearEntries();
}
