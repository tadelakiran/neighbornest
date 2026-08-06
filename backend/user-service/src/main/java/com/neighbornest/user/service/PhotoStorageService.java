package com.neighbornest.user.service;

import com.neighbornest.user.exception.BadRequestException;
import com.neighbornest.user.exception.ResourceNotFoundException;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Handles local storage and retrieval of profile photos.
 * <p>
 * Photos are persisted to a configurable directory on disk
 * ({@code app.upload.photo-dir}) and served back through the user-service.
 * A small allow-list of image types and a size cap keep uploads safe; the
 * {@link #resolve(String)} method guards against path traversal.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Service
@Slf4j
public class PhotoStorageService {

    /** Maximum accepted photo size in bytes (5 MB). */
    private static final long MAX_PHOTO_BYTES = 5 * 1024 * 1024L;

    /** Extension → content type map for the allowed image types. */
    private static final Map<String, MediaType> ALLOWED_TYPES = Map.of(
            "jpg", MediaType.IMAGE_JPEG,
            "jpeg", MediaType.IMAGE_JPEG,
            "png", MediaType.IMAGE_PNG,
            "webp", MediaType.parseMediaType("image/webp"),
            "gif", MediaType.IMAGE_GIF
    );

    private final Path photoDir;

    /**
     * Constructs the service with the configured storage directory.
     *
     * @param photoDir the absolute or relative photo directory
     */
    public PhotoStorageService(@Value("${app.upload.photo-dir:./uploads/photos}") final String photoDir) {
        this.photoDir = Paths.get(photoDir).toAbsolutePath().normalize();
    }

    /**
     * Ensures the photo directory exists before photos are stored.
     */
    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(photoDir);
            log.info("Photo storage directory ready at {}", photoDir);
        } catch (final IOException e) {
            log.error("Could not create photo storage directory {}", photoDir, e);
            throw new IllegalStateException("Photo storage directory is not writable", e);
        }
    }

    /**
     * Validates and stores an uploaded photo.
     *
     * @param file the multipart photo file
     * @return the stored file name (no path), used to build the photo URL
     * @throws BadRequestException if the file is missing, too large, or not an image
     */
    public String store(final MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("A photo file is required");
        }
        if (file.getSize() > MAX_PHOTO_BYTES) {
            throw new BadRequestException("Photo exceeds the 5 MB size limit");
        }

        final String extension = extensionOf(file.getOriginalFilename());
        if (!ALLOWED_TYPES.containsKey(extension)) {
            throw new BadRequestException("Only JPG, PNG, WEBP and GIF images are allowed");
        }

        final String storedName = UUID.randomUUID().toString().replace("-", "") + "." + extension;
        final Path target = photoDir.resolve(storedName);

        try {
            file.transferTo(target);
        } catch (final IOException e) {
            log.error("Failed to store photo {}", storedName, e);
            throw new IllegalStateException("Could not store the uploaded photo", e);
        }

        log.info("Stored photo {}", storedName);
        return storedName;
    }

    /**
     * Resolves a stored photo to a readable {@link Resource}.
     * <p>
     * Rejects anything that escapes the photo directory (path traversal).
     * </p>
     *
     * @param fileName the stored file name
     * @return the photo as a resource
     * @throws ResourceNotFoundException if the photo does not exist
     */
    public Resource resolve(final String fileName) {
        if (!StringUtils.hasText(fileName) || fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) {
            throw new ResourceNotFoundException("Photo not found");
        }

        final Path resolved = photoDir.resolve(fileName).normalize();
        if (!resolved.startsWith(photoDir)) {
            throw new ResourceNotFoundException("Photo not found");
        }

        final Resource resource = new FileSystemResource(resolved);
        if (!resource.exists() || !resource.isReadable()) {
            throw new ResourceNotFoundException("Photo not found");
        }
        return resource;
    }

    /**
     * Deletes a stored photo file if it exists (best-effort).
     * <p>
     * Used when a photo is replaced or a profile is deleted so orphaned files
     * do not accumulate on disk. Silently ignores unknown or unsafe names.
     * </p>
     *
     * @param fileName the stored file name
     */
    public void delete(final String fileName) {
        if (!StringUtils.hasText(fileName) || fileName.contains("..")
                || fileName.contains("/") || fileName.contains("\\")) {
            return;
        }
        final Path resolved = photoDir.resolve(fileName).normalize();
        if (!resolved.startsWith(photoDir)) {
            return;
        }
        try {
            if (Files.deleteIfExists(resolved)) {
                log.info("Deleted photo {}", fileName);
            }
        } catch (final IOException e) {
            log.warn("Could not delete photo {}: {}", fileName, e.getMessage());
        }
    }

    /**
     * Returns the content type for a stored photo file name.
     *
     * @param fileName the stored file name
     * @return the matching media type
     */
    public MediaType contentTypeFor(final String fileName) {
        return ALLOWED_TYPES.getOrDefault(extensionOf(fileName), MediaType.APPLICATION_OCTET_STREAM);
    }

    /**
     * Extracts the lowercase file extension from a file name.
     *
     * @param fileName the file name
     * @return the extension without the dot, or {@code null}
     */
    private String extensionOf(final String fileName) {
        if (!StringUtils.hasText(fileName)) {
            return null;
        }
        final int dot = fileName.lastIndexOf('.');
        if (dot < 0 || dot == fileName.length() - 1) {
            return null;
        }
        return fileName.substring(dot + 1).toLowerCase(Locale.ROOT);
    }
}
