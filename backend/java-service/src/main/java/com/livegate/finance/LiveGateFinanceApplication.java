package com.livegate.finance;

import com.livegate.finance.config.FinanceProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(FinanceProperties.class)
public class LiveGateFinanceApplication {
    public static void main(String[] args) {
        SpringApplication.run(LiveGateFinanceApplication.class, args);
    }
}

