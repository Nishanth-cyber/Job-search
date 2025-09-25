package Springboot.service;

import com.mongodb.client.gridfs.model.GridFSFile;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.data.mongodb.gridfs.GridFsTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;

@Service
public class FileStorageService {

    @Autowired
    private GridFsTemplate gridFsTemplate;

    public String storeFile(MultipartFile file, String userId) throws IOException {
        String filename = userId + "_" + System.currentTimeMillis() + "_" + file.getOriginalFilename();
        
        return gridFsTemplate.store(
            file.getInputStream(),
            filename,
            file.getContentType()
        ).toString();
    }

    public GridFsResource getFile(String fileId) {
        GridFSFile gridFSFile = gridFsTemplate.findOne(
            new Query(Criteria.where("_id").is(fileId))
        );
        
        if (gridFSFile != null) {
            return gridFsTemplate.getResource(gridFSFile);
        }
        
        return null;
    }

    public InputStream getFileInputStream(String fileId) throws IOException {
        GridFsResource resource = getFile(fileId);
        return resource != null ? resource.getInputStream() : null;
    }

    public void deleteFile(String fileId) {
        gridFsTemplate.delete(new Query(Criteria.where("_id").is(fileId)));
    }

    public boolean fileExists(String fileId) {
        GridFSFile gridFSFile = gridFsTemplate.findOne(
            new Query(Criteria.where("_id").is(fileId))
        );
        return gridFSFile != null;
    }

    public String getFileName(String fileId) {
        GridFSFile gridFSFile = gridFsTemplate.findOne(
            new Query(Criteria.where("_id").is(fileId))
        );
        return gridFSFile != null ? gridFSFile.getFilename() : null;
    }
}
