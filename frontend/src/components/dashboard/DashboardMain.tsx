import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import InkBoardCard from "./BoardCard";
import RoomSection from "./RoomComponent";
import { boardService } from "@/api/services/boardService";

const DashboardMain = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [boards, setBoards] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: "", description: "" });

  const fetchBoards = async () => {
    try {
      const data = await boardService.getBoards();
      setBoards(data);
    } catch (error) {
      console.error("Error fetching boards:", error);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  const selectedBoard = boards.find((b: any) => String(b.id || b._id) === selectedId);

  const handleEditToggle = () => {
    if (selectedBoard) {
      setEditData({
        name: selectedBoard.title || selectedBoard.name || "",
        description: selectedBoard.description || "",
      });
      setIsEditing(true);
    }
  };

  const handleEditBoard = async () => {
    if (!selectedId) return;
    try {
      await boardService.updateBoard(selectedId, editData);
      setIsEditing(false);
      fetchBoards();
    } catch (error) {
      console.error("Error updating board:", error);
    }
  };

  const handleDeleteBoard = async () => {
    if (!selectedId) return;
    if (!window.confirm("Are you sure you want to delete this board?")) return;
    try {
      await boardService.deleteBoard(selectedId);
      setSelectedId(null);
      fetchBoards();
    } catch (error) {
      console.error("Error deleting board:", error);
    }
  };

  return (
    <div className="h-full flex-1 min-w-0 relative">
      <main
          className="w-full h-full 
          rounded-3xl p-8 flex flex-col overflow-hidden
          shadow-md border border-neutral
          bg-base-200 gap-2"
        >
                <RoomSection />
                
                <div className="divider divider-neutral divider-start text-base-content text-2xl font-serif">Boards</div>
    
                      <div className="flex-wrap gap-9 pt-1 grid grid-cols-5 aspect-video overflow-y-auto custom-scrollbar">
                        {boards && boards.map((board) => (
                          <InkBoardCard 
                            key={board.id || board._id} 
                            id={board.id || board._id}
                            title={board.title || board.name}
                            editedAt={board.editedAt || board.updatedAt || new Date().toLocaleDateString()}
                            onClick={() => {
                              setSelectedId(String(board.id || board._id));
                              setIsEditing(false);
                            }} 
                          />
                        ))}
                      </div>
        </main>

        <AnimatePresence>
          {selectedId && selectedBoard && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setSelectedId(null);
                  setIsEditing(false);
                }}
                className="absolute inset-0 bg-base-300/60 backdrop-blur-sm cursor-pointer"
              />

              <motion.div
                layoutId={selectedId}
                className="relative w-full max-w-3xl overflow-hidden rounded-[14px] bg-base-100 p-8 shadow-2xl border border-neutral flex flex-col gap-6 font-serif z-10"
              >
                <div className="aspect-video w-full rounded-lg bg-base-300 flex items-center justify-center text-base-content/50">
                  PREVIEW HERE
                </div>

                {isEditing ? (
                  <div className="flex flex-col gap-4">
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="input input-bordered w-full font-serif text-2xl"
                    />
                    <textarea
                      value={editData.description}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      className="textarea textarea-bordered w-full h-32 font-serif"
                    />
                  </div>
                ) : (
                  <div>
                    <h2 className="font-['Playfair_Display',Georgia,serif] text-3xl font-bold text-base-content mb-2">
                      {selectedBoard.title || selectedBoard.name}
                    </h2>
                    <p className="font-['Crimson_Pro',Georgia,serif] text-sm text-base-content/50 italic mb-4">
                      {selectedBoard.editedAt || selectedBoard.updatedAt || new Date().toLocaleDateString()}
                    </p>
                    <div className="text-base-content/80 text-base">
                      {selectedBoard.description}
                    </div>
                  </div>
                )}

                <div className="mt-auto flex justify-between gap-3 font-sans">
                  <div className="flex gap-3">
                    {!isEditing && (
                      <button
                        onClick={handleDeleteBoard}
                        className="btn btn-error btn-outline"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <div className="flex gap-3">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="btn btn-ghost"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleEditBoard}
                          className="btn btn-primary"
                        >
                          Save Changes
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleEditToggle}
                          className="btn btn-ghost btn-outline border-neutral text-base-content"
                        >
                          Edit
                        </button>
                        <button className="btn btn-primary">
                          Open Board
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
    </div>
  )
}

export default DashboardMain
