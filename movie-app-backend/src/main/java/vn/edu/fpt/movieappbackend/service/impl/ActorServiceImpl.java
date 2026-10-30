package vn.edu.fpt.movieappbackend.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.fpt.movieappbackend.dto.request.ActorRequest;
import vn.edu.fpt.movieappbackend.dto.response.ActorResponse;
import vn.edu.fpt.movieappbackend.dto.response.PageResponse;
import vn.edu.fpt.movieappbackend.entity.Actor;
import vn.edu.fpt.movieappbackend.entity.enums.ActorGender;
import vn.edu.fpt.movieappbackend.exception.ResourceNotFoundException;
import vn.edu.fpt.movieappbackend.exception.ConflictException;
import vn.edu.fpt.movieappbackend.repository.ActorRepository;
import vn.edu.fpt.movieappbackend.repository.MovieRepository;
import vn.edu.fpt.movieappbackend.service.IActorService;
import vn.edu.fpt.movieappbackend.specification.ActorSpecification;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ActorServiceImpl implements IActorService {

    private final ActorRepository actorRepository;
    private final MovieRepository movieRepository;

    @Override
    public PageResponse<ActorResponse> getActors(String fullName, ActorGender gender, String country, Integer birthYear, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Specification<Actor> spec = ActorSpecification.filterActors(fullName, gender, country, birthYear);

        Page<Actor> actorPage = actorRepository.findAll(spec, pageable);

        List<ActorResponse> content = actorPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return new PageResponse<>(content, actorPage.getNumber(), actorPage.getSize(),
                actorPage.getTotalElements(), actorPage.getTotalPages(), actorPage.isLast());
    }

    @Override
    public ActorResponse getActorById(Long id) {
        Actor actor = actorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Actor với ID: " + id));
        return mapToResponse(actor);
    }

    @Override
    @Transactional
    public ActorResponse createActor(ActorRequest request) {
        Actor actor = Actor.builder()
                .fullName(request.fullName())
                .dob(request.dob())
                .country(request.country())
                .gender(request.gender())
                .avatarUrl(request.avatarUrl())
                .build();

        Actor savedActor = actorRepository.save(actor);
        return mapToResponse(savedActor);
    }

    @Override
    @Transactional
    public ActorResponse updateActor(Long id, ActorRequest request) {
        Actor actor = actorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Actor với ID: " + id));

        actor.setFullName(request.fullName());
        actor.setDob(request.dob());
        actor.setCountry(request.country());
        actor.setGender(request.gender());
        actor.setAvatarUrl(request.avatarUrl());

        Actor updatedActor = actorRepository.save(actor);
        return mapToResponse(updatedActor);
    }

    @Override
    @Transactional
    public void deleteActor(Long id) {
        Actor actor = actorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy diễn viên với ID: " + id));

        if (movieRepository.existsByActors_Id(id)) {
            throw new ConflictException("Không thể xóa diễn viên \"" + actor.getFullName()
                    + "\" vì đang tham gia một hoặc nhiều phim. Hãy gỡ diễn viên khỏi các phim trước.");
        }

        actorRepository.delete(actor);
    }

    // Helper map từ Entity sang Response (Record)
    public ActorResponse mapToResponse(Actor actor) {
        return new ActorResponse(
                actor.getId(),
                actor.getFullName(),
                actor.getDob(),
                actor.getCountry(),
                actor.getGender(),
                actor.getAvatarUrl()
        );
    }
}