"""
Custom exception classes for the application.

符合 CLAUDE.md 🟡: Domain exceptions in service layer → Global handler converts to HTTP responses
"""


class AppException(Exception):
    """Base exception class for application-specific errors"""

    def __init__(self, message: str, error_code: str | None = None):
        self.message = message
        self.error_code = error_code
        super().__init__(message)


class SubscriptionExpiredError(AppException):
    """
    Raised when subscription/trial has expired.

    This exception is used by SubscriptionService to indicate that the user's
    trial period or subscription has ended and they need to upgrade to continue
    using write features.
    """

    def __init__(self, message: str = "Subscription has expired. Please upgrade to continue."):
        super().__init__(message, error_code="SUBSCRIPTION_EXPIRED")
