"""
API Router for Experiment History Management
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import json

from ..core.database import get_db
from ..models.experiment import Experiment
from ..schemas.schemas import ExperimentCreateRequest

router = APIRouter(prefix="/experiments", tags=["Experiment History"])


@router.get("/")
def list_experiments(db: Session = Depends(get_db)):
    exps = db.query(Experiment).order_by(Experiment.created_at.desc()).all()
    return [
        {
            "id": e.id,
            "title": e.title,
            "description": e.description,
            "module": e.module,
            "algorithm": e.algorithm,
            "parameters": json.loads(e.parameters_json),
            "metrics": json.loads(e.metrics_json or "{}"),
            "input_preview": e.input_image_preview,
            "output_preview": e.output_image_preview,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        }
        for e in exps
    ]


@router.post("/")
def create_experiment(req: ExperimentCreateRequest, db: Session = Depends(get_db)):
    exp = Experiment(
        title=req.title,
        description=req.description,
        module=req.module,
        algorithm=req.algorithm,
        parameters_json=json.dumps(req.parameters),
        metrics_json=json.dumps(req.metrics or {}),
        input_image_preview=req.input_image_preview,
        output_image_preview=req.output_image_preview,
    )
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return {"id": exp.id, "title": exp.title, "status": "created"}


@router.get("/{experiment_id}")
def get_experiment(experiment_id: int, db: Session = Depends(get_db)):
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return {
        "id": exp.id,
        "title": exp.title,
        "description": exp.description,
        "module": exp.module,
        "algorithm": exp.algorithm,
        "parameters": json.loads(exp.parameters_json),
        "metrics": json.loads(exp.metrics_json or "{}"),
        "input_preview": exp.input_image_preview,
        "output_preview": exp.output_image_preview,
        "created_at": exp.created_at.isoformat() if exp.created_at else None,
    }


@router.delete("/{experiment_id}")
def delete_experiment(experiment_id: int, db: Session = Depends(get_db)):
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    db.delete(exp)
    db.commit()
    return {"status": "deleted", "id": experiment_id}
