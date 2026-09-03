package vn.edu.fpt.movieappbackend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.fpt.movieappbackend.entity.Genre;

@Repository
public interface GenreRepository extends JpaRepository<Genre, Long> {
}