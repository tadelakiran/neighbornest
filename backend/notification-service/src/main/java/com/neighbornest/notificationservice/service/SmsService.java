package com.neighbornest.notificationservice.service;

/**
 * Service abstraction for sending SMS notifications.
 * <p>
 * The concrete implementation currently logs the SMS instead of delivering it;
 * a Twilio-backed implementation is planned (see
 * {@code TwilioSmsServiceImpl}).
 * </p>
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
public interface SmsService {

    /**
     * Sends an SMS to the given phone number.
     *
     * @param phoneNumber the recipient's phone number
     * @param message     the SMS body
     * @return {@code true} if the SMS was accepted for delivery
     */
    boolean sendSms(String phoneNumber, String message);
}
