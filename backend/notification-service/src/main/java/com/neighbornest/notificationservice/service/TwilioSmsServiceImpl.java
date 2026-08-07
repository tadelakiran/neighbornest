package com.neighbornest.notificationservice.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

/**
 * SMS implementation for the Notification Service.
 * <p>
 * <strong>TODO (Twilio integration):</strong> replace the log-only behavior
 * with a real Twilio client once an account is provisioned — read the account
 * SID, auth token and from-number from configuration and call the Twilio REST
 * API. Until then, sends are logged and reported as successful so the rest of
 * the pipeline is exercisable end-to-end.
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
@Service
@Slf4j
public class TwilioSmsServiceImpl implements SmsService {

    /**
     * Logs the SMS that would be sent.
     *
     * @param phoneNumber the recipient's phone number
     * @param message     the SMS body
     * @return {@code true} if the number is present (and the SMS "sent"),
     *         {@code false} when no phone number is available
     */
    @Override
    public boolean sendSms(final String phoneNumber, final String message) {
        if (!StringUtils.hasText(phoneNumber)) {
            log.warn("SMS not sent: no phone number available for recipient");
            return false;
        }
        // TODO: Twilio integration — send via the Twilio REST API instead.
        log.info("[SMS placeholder] To: {} | {}", phoneNumber, message);
        return true;
    }
}
