package vn.edu.fpt.movieappbackend.dto.response;

import vn.edu.fpt.movieappbackend.entity.enums.MovieTier;

public record MovieTierEntryResponse(
        Long id,
        Long movieId,
        String title,
        Integer releaseYear,
        String posterUrl,
        String country,
        MovieTier tier,
        Integer position
) {}
