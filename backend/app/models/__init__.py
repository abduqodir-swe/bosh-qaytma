"""Models package — re-export all ORM classes for easy import."""
from app.models.app_user import AppUser
from app.models.driver_profile import DriverProfile
from app.models.load import Load
from app.models.load_application import LoadApplication
from app.models.chat_message import ChatMessage
from app.models.wallet import Wallet
from app.models.admin_notification import AdminNotification
from app.models.deleted_load import DeletedLoad

__all__ = [
    "AppUser",
    "DriverProfile",
    "Load",
    "LoadApplication",
    "ChatMessage",
    "Wallet",
    "AdminNotification",
    "DeletedLoad",
]
