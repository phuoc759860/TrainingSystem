using System.ComponentModel.DataAnnotations;

namespace TrainingSystem.DTOs.Progress
{
    public class UpdateProgressDto
    {
        public bool? IsCompleted { get; set; }

        public int? LastMaterialID { get; set; }
    }
}
