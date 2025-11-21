package Springboot.service;

import Springboot.model.ChallengeModel;
import Springboot.model.ChallengeSubmissionModel;
import Springboot.repository.ChallengeRepository;
import Springboot.repository.ChallengeSubmissionRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ChallengeService {

    private final ChallengeRepository challengeRepository;
    private final ChallengeSubmissionRepository submissionRepository;

    public ChallengeService(ChallengeRepository challengeRepository, ChallengeSubmissionRepository submissionRepository) {
        this.challengeRepository = challengeRepository;
        this.submissionRepository = submissionRepository;
    }

    public List<ChallengeModel> list(String q) {
        if (q != null && !q.isBlank()) {
            String regex = ".*" + java.util.regex.Pattern.quote(q) + ".*";
            return challengeRepository.findByActiveTrueAndTitleRegexIgnoreCaseOrderByCreatedAtDesc(regex);
        }
        return challengeRepository.findByActiveTrueOrderByCreatedAtDesc();
    }

    public Optional<ChallengeModel> getById(String id) {
        return challengeRepository.findById(id);
    }

    public ChallengeModel create(ChallengeModel c) {
        return challengeRepository.save(c);
    }

    public ChallengeSubmissionModel submit(String challengeId, String userId, String submitterEmail, String submitterName, String content) {
        ChallengeSubmissionModel s = new ChallengeSubmissionModel();
        s.setChallengeId(challengeId);
        s.setUserId(userId);
        s.setSubmitterEmail(submitterEmail);
        s.setSubmitterName(submitterName);
        s.setContent(content);
        return submissionRepository.save(s);
    }

    public List<ChallengeSubmissionModel> submissionsForChallenge(String challengeId) {
        return submissionRepository.findByChallengeIdOrderByCreatedAtDesc(challengeId);
    }
}
