package vn.edu.fpt.movieappbackend.dto.request;

import jakarta.validation.constraints.NotBlank;

public record GenreRequest(
        @NotBlank(message = "Tên thể loại không được để trống")
        String name
) {}