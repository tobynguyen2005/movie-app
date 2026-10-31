package vn.edu.fpt.movieappbackend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;
import vn.edu.fpt.movieappbackend.entity.Movie;
import vn.edu.fpt.movieappbackend.entity.enums.MovieStatus;

import java.util.List;

@Repository
public interface MovieRepository extends JpaRepository<Movie, Long>, JpaSpecificationExecutor<Movie> {
    boolean existsByActors_Id(Long actorId);

    boolean existsByGenres_Id(Long genreId);

    List<Movie> findByStatusOrderByTitleAsc(MovieStatus status);

    List<Movie> findByStatusAndTitleContainingIgnoreCaseOrderByTitleAsc(MovieStatus status, String title);
}