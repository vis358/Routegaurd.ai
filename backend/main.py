from fastapi import FastAPI

app = FastAPI(title="RouteGuard AI API")


@app.get("/")
def root():
    return {
        "message": "RouteGuard AI Backend is running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }