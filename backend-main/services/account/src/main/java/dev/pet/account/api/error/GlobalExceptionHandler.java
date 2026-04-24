package dev.pet.account.api.error;

import dev.pet.account.exception.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.dao.DataIntegrityViolationException;
import org.hibernate.exception.ConstraintViolationException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ApiError> handleBadRequest(BadRequestException ex, HttpServletRequest req) {
        return build(HttpStatus.BAD_REQUEST, ex.getMessage(), req);
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ApiError> handleUnauthorized(UnauthorizedException ex, HttpServletRequest req) {
        return build(HttpStatus.UNAUTHORIZED, ex.getMessage(), req);
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<ApiError> handleForbidden(ForbiddenException ex, HttpServletRequest req) {
        return build(HttpStatus.FORBIDDEN, ex.getMessage(), req);
    }

    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(NotFoundException ex, HttpServletRequest req) {
        return build(HttpStatus.NOT_FOUND, ex.getMessage(), req);
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ApiError> handleConflict(ConflictException ex, HttpServletRequest req) {
        return build(HttpStatus.CONFLICT, ex.getMessage(), req);
    }

    // 400 на валидацию @Valid
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
        List<ApiError.FieldViolation> violations = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(fe -> new ApiError.FieldViolation(fe.getField(), resolveMessage(fe)))
            .toList();

        ApiError body = new ApiError(
            OffsetDateTime.now(),
            HttpStatus.BAD_REQUEST.value(),
            HttpStatus.BAD_REQUEST.getReasonPhrase(),
            "Validation failed",
            req.getRequestURI(),
            violations
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    // 400 на типовые ошибки конвертации/парсинга
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiError> handleTypeMismatch(MethodArgumentTypeMismatchException ex, HttpServletRequest req) {
        String msg = "Invalid value for '%s'".formatted(ex.getName());
        return build(HttpStatus.BAD_REQUEST, msg, req);
    }

    // Фоллбэк 500
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleAny(Exception ex, HttpServletRequest req) {
        if (ex instanceof ResponseStatusException rse) {
            HttpStatus st = HttpStatus.resolve(rse.getStatusCode().value());
            String msg = rse.getReason() != null ? rse.getReason() : rse.getMessage();
            return build(st != null ? st : HttpStatus.BAD_REQUEST, msg, req);
        }
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Internal server error", req);
    }


    private ResponseEntity<ApiError> build(HttpStatus status, String message, HttpServletRequest req) {
        ApiError body = new ApiError(
            OffsetDateTime.now(),
            status.value(),
            status.getReasonPhrase(),
            message,
            req.getRequestURI(),
            List.of()
        );
        return ResponseEntity.status(status).body(body);
    }

    @ExceptionHandler({
        DuplicateKeyException.class,
        DataIntegrityViolationException.class,
        ConstraintViolationException.class
    })
    public ResponseEntity<ApiError> handleDuplicate(Exception ex, HttpServletRequest req) {
        // "Email already registered"
        return build(HttpStatus.CONFLICT, ex.getMessage(), req);
    }

    private String resolveMessage(FieldError fe) {
        return fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "Invalid value";
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiError> handleResponseStatus(ResponseStatusException ex, HttpServletRequest req) {
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode().value());
        String message = ex.getReason() != null ? ex.getReason() : ex.getMessage();
        return build(status != null ? status : HttpStatus.BAD_REQUEST, message, req);
    }

    @ExceptionHandler({ AccessDeniedException.class, AuthorizationDeniedException.class })
    public ResponseEntity<ApiError> handleAccessDenied(RuntimeException ex,
                                                       HttpServletRequest req) {
        System.out.println(">>> AccessDenied handled: " + ex.getClass().getName());

        return build(HttpStatus.FORBIDDEN, "Access denied", req);
    }

}
