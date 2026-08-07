package com.neighbornest.chatservice.enums;

/**
 * The kind of content a chat message carries.
 *
 * @author NeighborNest Team
 * @version 1.0.0
 */
public enum MessageType {

    /** Plain-text message. */
    TEXT,

    /** Image message (content holds a reference or URL to the image). */
    IMAGE,

    /** Auto-generated message (e.g. "Sarah joined the Nest"). */
    SYSTEM
}
