class Status:
    def __init__(self, id, name, color):
        self.id = id
        self.name = name
        self.color = color

    def __repr__(self):
        return f"<Status(id={self.id}, name='{self.name}', color={self.color})>"
    
    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "color": self.color
        }