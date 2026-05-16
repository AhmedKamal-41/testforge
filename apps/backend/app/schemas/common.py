from pydantic import BaseModel


class Message(BaseModel):
    detail: str


class HealthOut(BaseModel):
    status: str
