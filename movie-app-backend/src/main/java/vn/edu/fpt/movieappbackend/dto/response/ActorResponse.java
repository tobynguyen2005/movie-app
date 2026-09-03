package vn.edu.fpt.movieappbackend.dto.response;

import vn.edu.fpt.movieappbackend.entity.enums.ActorGender;
import java.time.LocalDate;

public record ActorResponse(
        Long id,
        String fullName,
        LocalDate dob,
        String country,
        ActorGender gender,
        String avatarUrl
) {}