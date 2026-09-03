package vn.edu.fpt.movieappbackend.specification;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import vn.edu.fpt.movieappbackend.entity.Actor;
import vn.edu.fpt.movieappbackend.entity.Genre;
import vn.edu.fpt.movieappbackend.entity.Movie;
import vn.edu.fpt.movieappbackend.entity.enums.MovieStatus;

import java.util.ArrayList;
import java.util.List;

public class MovieSpecification {
    public static Specification<Movie> filterMovies(
            String title, Integer releaseYear, String country,
            Long genreId, Long maleActorId, Long femaleActorId, MovieStatus status) {

        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (Long.class != query.getResultType()) {
                root.fetch("genres", jakarta.persistence.criteria.JoinType.LEFT);
                root.fetch("actors", jakarta.persistence.criteria.JoinType.LEFT);
                query.distinct(true);
            }

            if (title != null && !title.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("title")), "%" + title.toLowerCase() + "%"));
            }

            if (releaseYear != null) {
                predicates.add(cb.equal(root.get("releaseYear"), releaseYear));
            }

            if (country != null && !country.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("country")), "%" + country.toLowerCase() + "%"));
            }

            if (genreId != null) {
                Join<Movie, Genre> genreJoin = root.join("genres");
                predicates.add(cb.equal(genreJoin.get("id"), genreId));
            }

            if (maleActorId != null) {
                Join<Movie, Actor> maleActorJoin = root.join("actors");
                predicates.add(cb.equal(maleActorJoin.get("id"), maleActorId));
            }

            if (femaleActorId != null) {
                Join<Movie, Actor> femaleActorJoin = root.join("actors");
                predicates.add(cb.equal(femaleActorJoin.get("id"), femaleActorId));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}