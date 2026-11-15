"""
API Router for Advanced Module: Visual Processing Pipeline
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import json

from ..schemas.schemas import PipelineExecuteRequest, PipelineSaveRequest
from ..processing.pipeline_engine import execute_pipeline
from ..core.database import get_db
from ..models.experiment import SavedPipeline

router = APIRouter(prefix="/pipeline", tags=["Advanced: Visual Pipeline"])


@router.post("/execute")
def run_pipeline(req: PipelineExecuteRequest):
    return execute_pipeline(
        nodes=req.nodes,
        edges=req.edges,
        initial_image_b64=req.initial_image
    )


@router.get("/saved")
def list_saved_pipelines(db: Session = Depends(get_db)):
    pipelines = db.query(SavedPipeline).order_by(SavedPipeline.created_at.desc()).all()
    return [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "nodes": json.loads(p.nodes_json),
            "edges": json.loads(p.edges_json),
            "thumbnail": p.thumbnail_b64,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in pipelines
    ]


@router.post("/save")
def save_pipeline(req: PipelineSaveRequest, db: Session = Depends(get_db)):
    p = SavedPipeline(
        name=req.name,
        description=req.description,
        nodes_json=json.dumps(req.nodes),
        edges_json=json.dumps(req.edges),
        thumbnail_b64=req.thumbnail,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return {"id": p.id, "name": p.name, "status": "saved"}


@router.delete("/saved/{pipeline_id}")
def delete_pipeline(pipeline_id: int, db: Session = Depends(get_db)):
    p = db.query(SavedPipeline).filter(SavedPipeline.id == pipeline_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Pipeline not found")
    db.delete(p)
    db.commit()
    return {"status": "deleted", "id": pipeline_id}
