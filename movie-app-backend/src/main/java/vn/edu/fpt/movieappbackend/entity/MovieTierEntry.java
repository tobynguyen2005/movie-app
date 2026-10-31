package vn.edu.fpt.movieappbackend.entity;

import jakarta.persistence.*;
import lombok.*;
import vn.edu.fpt.movieappbackend.entity.enums.MovieTier;

@Entity
@Table(name = "movie_tier_entries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MovieTierEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "movie_id", nullable = false, unique = true)
    private Movie movie;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 1)
    private MovieTier tier;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;
}
