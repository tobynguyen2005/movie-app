package vn.edu.fpt.movieappbackend.specification;

import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
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

            if (title != null && !title.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("title")), "%" + title.toLowerCase() + "%"));
            }

            if (releaseYear != null) {
                predicates.add(cb.equal(root.get("releaseYear"), releaseYear));
            }

            if (country != null && !country.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("country")), "%" + country.toLowerCase() + "%"));
            }

            // EXISTS filters a many-to-many relationship without multiplying movie rows.
            // This keeps pagination accurate even when a movie has several actors/genres.
            if (genreId != null) {
                Subquery<Long> genreSubquery = query.subquery(Long.class);
                Root<Movie> genreMovie = genreSubquery.from(Movie.class);
                Join<Movie, Genre> genreJoin = genreMovie.join("genres");
                genreSubquery.select(genreMovie.get("id"))
                        .where(
                                cb.equal(genreMovie.get("id"), root.get("id")),
                                cb.equal(genreJoin.get("id"), genreId)
                        );
                predicates.add(cb.exists(genreSubquery));
            }

            if (maleActorId != null) {
                predicates.add(hasActor(root, query.subquery(Long.class), cb, maleActorId));
            }

            if (femaleActorId != null) {
                predicates.add(hasActor(root, query.subquery(Long.class), cb, femaleActorId));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private static Predicate hasActor(
            Root<Movie> root,
            Subquery<Long> subquery,
            jakarta.persistence.criteria.CriteriaBuilder cb,
            Long actorId) {

        Root<Movie> actorMovie = subquery.from(Movie.class);
        Join<Movie, Actor> actorJoin = actorMovie.join("actors");
        subquery.select(actorMovie.get("id"))
                .where(
                        cb.equal(actorMovie.get("id"), root.get("id")),
                        cb.equal(actorJoin.get("id"), actorId)
                );
        return cb.exists(subquery);
    }
}
