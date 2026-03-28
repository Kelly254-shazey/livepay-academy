package com.livegate.finance.common;

import com.livegate.finance.config.RequestTracingFilter;
import jakarta.validation.ConstraintViolationException;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApiException(ApiException exception, HttpServletRequest request) {
        return ResponseEntity.status(exception.getStatus())
                .body(new ErrorResponse(
                        Instant.now(),
                        exception.getStatus().value(),
                        exception.getMessage(),
                        traceId(request)
                ));
    }

    @ExceptionHandler({MethodArgumentNotValidException.class, ConstraintViolationException.class})
    public ResponseEntity<ErrorResponse> handleValidation(Exception exception, HttpServletRequest request) {
        return ResponseEntity.badRequest()
                .body(new ErrorResponse(
                        Instant.now(),
                        HttpStatus.BAD_REQUEST.value(),
                        exception.getMessage(),
                        traceId(request)
                ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception exception, HttpServletRequest request) {
        return ResponseEntity.internalServerError()
                .body(new ErrorResponse(
                        Instant.now(),
                        HttpStatus.INTERNAL_SERVER_ERROR.value(),
                        exception.getMessage(),
                        traceId(request)
                ));
    }

    private String traceId(HttpServletRequest request) {
        Object value = request.getAttribute(RequestTracingFilter.REQUEST_ID_ATTRIBUTE);
        return value instanceof String ? (String) value : null;
    }
}
