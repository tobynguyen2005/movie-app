package vn.edu.fpt.movieappbackend.service;

import vn.edu.fpt.movieappbackend.dto.request.ActorRequest;
import vn.edu.fpt.movieappbackend.dto.response.ActorResponse;
import vn.edu.fpt.movieappbackend.dto.response.PageResponse;
import vn.edu.fpt.movieappbackend.entity.enums.ActorGender;

import java.util.List;

public interface IActorService {
    PageResponse<ActorResponse> getActors(String fullName, ActorGender gender, String country, Integer birthYear, int page, int size);
    ActorResponse getActorById(Long id);
    ActorResponse createActor(ActorRequest request);
    ActorResponse updateActor(Long id, ActorRequest request);
    void deleteActor(Long id);

}