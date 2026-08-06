package com.neighbornest.user.service;

import com.neighbornest.user.exception.BadRequestException;
import com.neighbornest.user.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests for {@link PhotoStorageService}.
 * <p>
 * Uses a real temporary directory on disk to exercise store/resolve without
 * touching any production storage location.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@DisplayName("PhotoStorageService Unit Tests")
class PhotoStorageServiceTest {

    @TempDir
    private Path tempDir;

    private PhotoStorageService service;

    @BeforeEach
    void setUp() {
        service = new PhotoStorageService(tempDir.toString());
        service.init();
    }

    @Nested
    @DisplayName("store method")
    class StoreTests {

        @Test
        @DisplayName("Should store a valid JPG and return a sanitized file name")
        void shouldStoreValidImage() {
            final MockMultipartFile file = new MockMultipartFile(
                    "file", "my-photo.jpg", MediaType.IMAGE_JPEG_VALUE, new byte[]{1, 2, 3});

            final String storedName = service.store(file);

            assertThat(storedName).isNotBlank();
            assertThat(storedName).endsWith(".jpg");
            // Stored name is a sanitized UUID — the original name is never used on disk
            assertThat(storedName).doesNotContain("my-photo");
            assertThat(tempDir.resolve(storedName)).exists();
        }

        @Test
        @DisplayName("Should reject an empty file")
        void shouldRejectEmptyFile() {
            final MockMultipartFile file = new MockMultipartFile("file", "photo.jpg", MediaType.IMAGE_JPEG_VALUE, new byte[0]);

            assertThatThrownBy(() -> service.store(file))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("required");
        }

        @Test
        @DisplayName("Should reject a non-image file type")
        void shouldRejectNonImage() {
            final MockMultipartFile file = new MockMultipartFile(
                    "file", "notes.txt", MediaType.TEXT_PLAIN_VALUE, "hello".getBytes());

            assertThatThrownBy(() -> service.store(file))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Only JPG, PNG, WEBP and GIF");
        }

        @Test
        @DisplayName("Should reject a file over the 5 MB limit")
        void shouldRejectOversizedFile() {
            final MockMultipartFile file = new MockMultipartFile(
                    "file", "big.png", MediaType.IMAGE_PNG_VALUE, new byte[5 * 1024 * 1024 + 1]);

            assertThatThrownBy(() -> service.store(file))
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("5 MB");
        }

        @Test
        @DisplayName("Should accept PNG, WEBP and GIF variants")
        void shouldAcceptAllAllowedTypes() {
            assertThat(service.store(new MockMultipartFile("f", "a.png", "image/png", new byte[]{1}))).endsWith(".png");
            assertThat(service.store(new MockMultipartFile("f", "b.webp", "image/webp", new byte[]{1}))).endsWith(".webp");
            assertThat(service.store(new MockMultipartFile("f", "c.gif", "image/gif", new byte[]{1}))).endsWith(".gif");
        }
    }

    @Nested
    @DisplayName("resolve method")
    class ResolveTests {

        @Test
        @DisplayName("Should return a stored photo as a readable resource")
        void shouldResolveStoredPhoto() {
            final String storedName = service.store(
                    new MockMultipartFile("f", "photo.jpg", MediaType.IMAGE_JPEG_VALUE, new byte[]{1}));

            final Resource resource = service.resolve(storedName);

            assertThat(resource.exists()).isTrue();
            assertThat(resource.isReadable()).isTrue();
        }

        @Test
        @DisplayName("Should reject path traversal attempts")
        void shouldRejectPathTraversal() {
            assertThatThrownBy(() -> service.resolve("../../etc/passwd"))
                    .isInstanceOf(ResourceNotFoundException.class);
            assertThatThrownBy(() -> service.resolve("..%2Fsecret.jpg"))
                    .isInstanceOf(ResourceNotFoundException.class);
        }

        @Test
        @DisplayName("Should reject a missing photo")
        void shouldRejectMissingPhoto() {
            assertThatThrownBy(() -> service.resolve("does-not-exist.jpg"))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("contentTypeFor method")
    class ContentTypeTests {

        @Test
        @DisplayName("Should map extensions to the correct media type")
        void shouldMapExtensions() {
            assertThat(service.contentTypeFor("a.jpg")).isEqualTo(MediaType.IMAGE_JPEG);
            assertThat(service.contentTypeFor("a.png")).isEqualTo(MediaType.IMAGE_PNG);
            assertThat(service.contentTypeFor("a.webp")).isEqualTo(MediaType.parseMediaType("image/webp"));
            assertThat(service.contentTypeFor("a.unknown")).isEqualTo(MediaType.APPLICATION_OCTET_STREAM);
        }
    }
}
