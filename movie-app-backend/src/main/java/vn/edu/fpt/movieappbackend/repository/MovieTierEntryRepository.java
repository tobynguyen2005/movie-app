package vn.edu.fpt.movieappbackend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.fpt.movieappbackend.entity.MovieTierEntry;

import java.util.List;
import java.util.Optional;

@Repository
public interface MovieTierEntryRepository extends JpaRepository<MovieTierEntry, Long> {
    List<MovieTierEntry> findAllByOrderBySortOrderAscIdAsc();
    Optional<MovieTierEntry> findByMovie_Id(Long movieId);
    boolean existsByMovie_Id(Long movieId);
}
