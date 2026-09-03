package vn.edu.fpt.movieappbackend.controller;


import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.edu.fpt.movieappbackend.dto.request.ActorRequest;
import vn.edu.fpt.movieappbackend.dto.response.ActorResponse;
import vn.edu.fpt.movieappbackend.dto.response.PageResponse;
import vn.edu.fpt.movieappbackend.entity.enums.ActorGender;
import vn.edu.fpt.movieappbackend.service.IActorService;

import java.util.List;

@RestController
@RequestMapping("/api/actors")
@RequiredArgsConstructor
public class ActorController {

    private final IActorService actorService;

    @GetMapping
    public ResponseEntity<PageResponse<ActorResponse>> getActors(
            @RequestParam(required = false) String fullName,
            @RequestParam(required = false) ActorGender gender,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) Integer birthYear,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(actorService.getActors(fullName, gender, country, birthYear, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ActorResponse> getActorById(@PathVariable Long id) {
        return ResponseEntity.ok(actorService.getActorById(id));
    }

    @PostMapping
    public ResponseEntity<ActorResponse> createActor(@Valid @RequestBody ActorRequest request) {
        return new ResponseEntity<>(actorService.createActor(request), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ActorResponse> updateActor(@PathVariable Long id, @Valid @RequestBody ActorRequest request) {
        return ResponseEntity.ok(actorService.updateActor(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteActor(@PathVariable Long id) {
        actorService.deleteActor(id);
        return ResponseEntity.noContent().build();
    }
}