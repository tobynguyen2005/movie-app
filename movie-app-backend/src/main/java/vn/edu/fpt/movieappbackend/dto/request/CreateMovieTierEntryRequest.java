package vn.edu.fpt.movieappbackend.dto.request;

import jakarta.validation.constraints.NotNull;
import vn.edu.fpt.movieappbackend.entity.enums.MovieTier;

public record CreateMovieTierEntryRequest(
        @NotNull(message = "Vui lòng chọn phim.") Long movieId,
        @NotNull(message = "Vui lòng chọn tier.") MovieTier tier
) {}
