# RabbitMQ with STOMP plugin enabled for Railway deployment.
# The official rabbitmq:3-management image does not enable STOMP by default.
# This Dockerfile enables it at build time so the container is ready immediately.

FROM rabbitmq:3-management

# Enable the STOMP plugin (--offline so it doesn't need a running broker)
RUN rabbitmq-plugins enable --offline rabbitmq_stomp
