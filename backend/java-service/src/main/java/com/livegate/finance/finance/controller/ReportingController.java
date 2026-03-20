package com.livegate.finance.finance.controller;

import com.livegate.finance.finance.dto.RevenueSummaryResponse;
import com.livegate.finance.finance.service.ReportingService;
import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/reports")
public class ReportingController {

    private final ReportingService reportingService;

    public ReportingController(ReportingService reportingService) {
        this.reportingService = reportingService;
    }

    @GetMapping("/revenue-summary")
    public RevenueSummaryResponse revenueSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return reportingService.revenueSummary(from, to);
    }

    @GetMapping("/platform-commission")
    public RevenueSummaryResponse platformCommission(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return reportingService.platformCommission(from, to);
    }

    @GetMapping("/creator-earnings")
    public RevenueSummaryResponse creatorEarnings(
            @RequestParam String creatorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return reportingService.creatorEarnings(creatorId, from, to);
    }
}

