import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Minus, Plus } from "lucide-react";

interface ScoreEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchId?: number;
}

export default function ScoreEntryModal({ isOpen, onClose, matchId }: ScoreEntryModalProps) {
  const [selectedHole, setSelectedHole] = useState(1);
  const [playerScores, setPlayerScores] = useState<Record<number, number>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateScoreMutation = useMutation({
    mutationFn: async (scoreData: any) => {
      return await apiRequest('POST', '/api/hole-scores', scoreData);
    },
    onSuccess: () => {
      toast({
        title: "Score Updated",
        description: "Hole score has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update score. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleScoreChange = (playerId: number, change: number) => {
    setPlayerScores(prev => ({
      ...prev,
      [playerId]: Math.max(1, (prev[playerId] || 4) + change)
    }));
  };

  const handleSubmit = () => {
    if (!matchId) return;

    Object.entries(playerScores).forEach(([playerId, strokes]) => {
      updateScoreMutation.mutate({
        matchId,
        playerId: parseInt(playerId),
        hole: selectedHole,
        strokes,
        par: 4, // Default par, could be dynamic
      });
    });
  };

  const getScoreClass = (score: number, par: number = 4) => {
    if (score === par - 2) return 'eagle';
    if (score === par - 1) return 'birdie';
    if (score === par) return 'par';
    if (score === par + 1) return 'bogey';
    return 'double-bogey';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Update Scores</DialogTitle>
        </DialogHeader>

        {/* Hole Selection */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Hole Number</Label>
            <div className="grid grid-cols-6 gap-2 mt-2">
              {Array.from({ length: 18 }, (_, i) => i + 1).map(hole => (
                <button
                  key={hole}
                  onClick={() => setSelectedHole(hole)}
                  className={`p-2 text-sm rounded ${
                    selectedHole === hole 
                      ? 'bg-green-400 text-gray-900' 
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {hole}
                </button>
              ))}
            </div>
          </div>

          {/* Mock Players for Demo */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Player Scores</Label>
            
            {[
              { id: 1, name: "Player 1", team: "Aviators" },
              { id: 2, name: "Player 2", team: "Aviators" },
              { id: 3, name: "Player 3", team: "Producers" },
              { id: 4, name: "Player 4", team: "Producers" },
            ].map(player => {
              const score = playerScores[player.id] || 4;
              return (
                <Card key={player.id} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{player.name}</p>
                        <p className="text-xs text-gray-400">{player.team}</p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleScoreChange(player.id, -1)}
                          className="w-8 h-8 p-0"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        
                        <div className={`hole-score ${getScoreClass(score)}`}>
                          {score}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleScoreChange(player.id, 1)}
                          className="w-8 h-8 p-0"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={updateScoreMutation.isPending}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {updateScoreMutation.isPending ? 'Saving...' : 'Save Scores'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
