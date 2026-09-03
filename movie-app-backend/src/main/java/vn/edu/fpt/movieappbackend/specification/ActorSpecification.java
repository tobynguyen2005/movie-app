package vn.edu.fpt.movieappbackend.specification;

import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import vn.edu.fpt.movieappbackend.entity.Actor;
import vn.edu.fpt.movieappbackend.entity.enums.ActorGender;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class ActorSpecification {
    public static Specification<Actor> filterActors(String fullName, ActorGender gender, String country, Integer birthYear) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (fullName != null && !fullName.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("fullName")), "%" + fullName.toLowerCase() + "%"));
            }

            if (gender != null) {
                predicates.add(cb.equal(root.get("gender"), gender));
            }
            if (country != null && !country.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("country")), "%" + country.toLowerCase() + "%"));
            }
            if (birthYear != null) {
                LocalDate startDate = LocalDate.of(birthYear, 1, 1);
                LocalDate endDate = LocalDate.of(birthYear, 12, 31);
                predicates.add(cb.between(root.get("dob"), startDate, endDate));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}