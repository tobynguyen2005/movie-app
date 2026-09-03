package vn.edu.fpt.movieappbackend.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import vn.edu.fpt.movieappbackend.entity.enums.MovieStatus;
import java.util.Set;

public record MovieRequest(
        @NotBlank(message = "Tiêu đề phim không được để trống")
        String title,

        @Min(value = 1900, message = "Năm phát hành phải từ 1900 trở lên")
        Integer releaseYear,

        @Min(value = 1, message = "Số tập tối thiểu là 1")
        Integer totalEpisodes,

        String country,
        String posterUrl,
        String description,
        MovieStatus status,
        Set<Long> actorIds,
        Set<Long> genreIds
) {}