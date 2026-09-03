package vn.edu.fpt.movieappbackend.dto.response;

import vn.edu.fpt.movieappbackend.entity.enums.MovieStatus;
import java.util.Set;

public record MovieResponse(
        Long id,
        String title,
        Integer releaseYear,
        Integer totalEpisodes,
        String country,
        String posterUrl,
        String description,
        MovieStatus status,
        Set<ActorResponse> actors,
        Set<GenreResponse> genres
) {}