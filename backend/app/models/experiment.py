"""
SQLAlchemy Models for Persistent Experiment History and Saved Pipelines
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Float, DateTime
from ..core.database import Base


class Experiment(Base):
    __tablename__ = "experiments"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    module = Column(String(64), nullable=False)  # e.g., 'fundamentals', 'enhancement', 'frequency'
    algorithm = Column(String(64), nullable=False)
    
    # Store parameters as JSON string
    parameters_json = Column(Text, nullable=False, default="{}")
    
    # Store quality metrics as JSON string
    metrics_json = Column(Text, nullable=True, default="{}")

    # Image data URLs or paths
    input_image_preview = Column(Text, nullable=False)
    output_image_preview = Column(Text, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SavedPipeline(Base):
    __tablename__ = "saved_pipelines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    
    # Graph structure as JSON string
    nodes_json = Column(Text, nullable=False, default="[]")
    edges_json = Column(Text, nullable=False, default="[]")

    thumbnail_b64 = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
