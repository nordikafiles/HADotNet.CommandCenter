﻿using HADotNet.CommandCenter.Models.Config.Tiles;
using HADotNet.CommandCenter.Services.Interfaces;
using HADotNet.CommandCenter.Utils;
using Microsoft.AspNetCore.Mvc;
using System.Linq;
using System.Threading.Tasks;

namespace HADotNet.CommandCenter.Controllers
{
    public class BaseTileController : Controller
    {
        protected async Task<IActionResult> SaveBaseTile([FromRoute] string page, IConfigStore store, BaseTile tile)
        {
            await store.ManipulateConfig(c =>
            {
                if (!string.IsNullOrWhiteSpace(Request.Form["originalName"]))
                {
                    var existing = c[page].Tiles.FirstOrDefault(t => t.Name == Request.Form["originalName"]);
                    if (existing == null)
                    {
                        TempData.AddError($"Unable to update tile with original name '{Request.Form["originalName"]}'.");
                    }

                    var i = c[page].Tiles.IndexOf(existing);
                    c[page].Tiles.RemoveAt(i);
                    c[page].Tiles.Insert(i, tile);
                }
                else
                {
                    c[page].Tiles.Add(tile);
                }
            });

            TempData.AddSuccess($"Successfully saved {tile.Type} tile '{tile.Name}'.");

            return RedirectToAction("Index", "AdminTile", new { page });
        }
    }
}
