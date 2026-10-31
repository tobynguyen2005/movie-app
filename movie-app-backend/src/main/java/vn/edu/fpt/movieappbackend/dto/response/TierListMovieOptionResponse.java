package vn.edu.fpt.movieappbackend.dto.response;

public record TierListMovieOptionResponse(
        Long id,
        String title,
        Integer releaseYear,
        String posterUrl,
        String country
) {}
