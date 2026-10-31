package vn.edu.fpt.movieappbackend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import vn.edu.fpt.movieappbackend.entity.enums.MovieTier;

public record ReorderMovieTierEntryRequest(
        @NotNull(message = "Thiếu ID mục Tier List.") Long id,
        @NotNull(message = "Thiếu tier mới.") MovieTier tier,
        @NotNull(message = "Thiếu vị trí sắp xếp.") @Min(value = 0, message = "Vị trí không được âm.") Integer position
) {}
