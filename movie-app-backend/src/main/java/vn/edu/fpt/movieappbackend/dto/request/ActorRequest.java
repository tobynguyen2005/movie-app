package vn.edu.fpt.movieappbackend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import vn.edu.fpt.movieappbackend.entity.enums.ActorGender;

import java.time.LocalDate;

public record ActorRequest(
        @NotBlank(message = "Tên diễn viên không được để trống")
        String fullName,

        LocalDate dob,

        String country,

        @NotNull(message = "Giới tính không được để trống")
        ActorGender gender,

        String avatarUrl
) {}